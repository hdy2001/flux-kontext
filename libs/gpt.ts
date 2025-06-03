import axios from 'axios';

// Use this if you want to make a call to OpenAI GPT-4 for instance. userId is used to identify the user on openAI side.
export const sendOpenAi = async (
  messages: any[], // TODO: type this
  userId: string,
  max = 1000,
  temp = 1
) => {
  const url = 'https://api.vveai.com/v1/chat/completions';

  console.log('Ask GPT >>>');
  messages.map((m) =>
    console.log(' - ' + m.role.toUpperCase() + ': ' + m.content)
  );

  const body = JSON.stringify({
    model: 'gpt-4',
    messages,
    max_tokens: max,
    temperature: temp,
    user: userId,
  });

  const options = {
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
  };

  try {
    console.log('test gpt lib url body options', url, body, options)
    const res = await axios.post(url, body, options);
    console.log('test gpt lib res', res)

    const answer = res.data.choices[0].message.content;
    const usage = res?.data?.usage;

    console.log('>>> ' + answer);
    console.log(
      'TOKENS USED: ' +
      usage?.total_tokens +
      ' (prompt: ' +
      usage?.prompt_tokens +
      ' / response: ' +
      usage?.completion_tokens +
      ')'
    );
    console.log('\n');

    return answer;
  } catch (e) {
    console.error('GPT Error: ' + e?.response?.status, e?.response?.data);
    return null;
  }
};
