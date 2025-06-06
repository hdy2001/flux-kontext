-- 创建用户API使用情况表
CREATE TABLE IF NOT EXISTS public.user_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  used_count INTEGER NOT NULL DEFAULT 0,
  limit_count INTEGER NOT NULL DEFAULT 20,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,

  -- 确保每个用户只有一条记录
  CONSTRAINT user_usage_user_id_key UNIQUE (user_id)
);

-- 添加行级安全策略
ALTER TABLE public.user_usage ENABLE ROW LEVEL SECURITY;

-- 创建策略：用户只能查看自己的使用情况
CREATE POLICY "用户可以查看自己的使用情况"
  ON public.user_usage
  FOR SELECT
  USING (auth.uid() = user_id);

-- 创建策略：只有服务角色可以更新使用情况
CREATE POLICY "只有服务角色可以更新使用情况"
  ON public.user_usage
  FOR UPDATE
  USING (auth.uid() = user_id);

-- 创建触发器函数，在用户注册时自动创建使用情况记录
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_usage (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建触发器，在新用户创建时自动创建使用情况记录
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 为现有用户创建使用情况记录
INSERT INTO public.user_usage (user_id)
SELECT id FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.user_usage)
ON CONFLICT (user_id) DO NOTHING;
