"use client";

import React, { useState } from "react";
import { toast } from "react-hot-toast";
import apiClient from '@/libs/api';

interface DietPlanFormData {
  mealsPerDay: string;
  healthGoal: string;
  allergies: string;
  dietaryPreference: string;
  email: string;
}

const DietPlanForm = () => {
  const [formData, setFormData] = useState<DietPlanFormData>({
    mealsPerDay: "",
    healthGoal: "",
    allergies: "",
    dietaryPreference: "",
    email: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [aiResult, setAiResult] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 构造messages，假设formData转为prompt
      const messages = [
        { role: "system", content: "You are a professional nutritionist. Please generate a personalized one-week meal plan based on the user's information. Include breakfast, lunch, and dinner for each day, along with the corresponding calorie values.\\Requirements:1.Do not output any text other than the meal plan itself. 2.Do not include nutritional components." },
        { role: "user", content: `User Info：${JSON.stringify(formData)}` }
      ];
      // userId用email的hash或简单用email长度
      const userId = formData.email ? formData.email : "anonymous";
      const response = await apiClient.post('/gpt', {
        messages,
        userId,
        max: 1000,
        temp: 0.8
      });
      const aiResult = (response as any).result;
      console.log(aiResult);
      if (aiResult) {
        setAiResult(aiResult);
        toast.success("AI饮食计划生成！");
      } else {
        toast.error("AI生成失败，请重试");
      }
    } catch (error) {
      console.error(error);
      toast.error("提交失败，请重试");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto p-6 space-y-6 bg-gray-200 rounded-xl">
      {!aiResult && (
        <>
          <h2 className="text-2xl font-bold text-center">AI Meal Planner</h2>
          <p className="text-center mb-4">Personalized AI Meal Planning</p>

          <div>
            <label className="block text-sm font-medium mb-1">Number of Meals per day</label>
            <select
              value={formData.mealsPerDay}
              onChange={(e) => setFormData({ ...formData, mealsPerDay: e.target.value })}
              className="input input-bordered w-full"
              required
            >
              <option value="">-- please select an option --</option>
              <option value="1">1 meal</option>
              <option value="2">2 meals</option>
              <option value="3">3 meals</option>
              <option value="4">4 meals</option>
              <option value="5">5 meals</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Health Goals</label>
            <select
              value={formData.healthGoal}
              onChange={(e) => setFormData({ ...formData, healthGoal: e.target.value })}
              className="input input-bordered w-full"
              required
            >
              <option value="">-- please select an option --</option>
              <option value="weight_loss">Weight Loss</option>
              <option value="weight_loss">Weight Gain</option>
              <option value="muscle_gain">Muscle Gain</option>
              <option value="maintenance">Maintenance</option>
              <option value="improve_health">Improve Health</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Allergies/Intolerances</label>
            <input
              type="text"
              value={formData.allergies}
              onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
              className="input input-bordered w-full"
              placeholder="Enter your text"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Dietary Preferences</label>
            <select
              value={formData.dietaryPreference}
              onChange={(e) => setFormData({ ...formData, dietaryPreference: e.target.value })}
              className="input input-bordered w-full"
              required
            >
              <option value="">-- please select an option --</option>
              <option value="none">None</option>
              <option value="vegetarian">Vegetarian</option>
              <option value="vegan">Vegan</option>
              <option value="gluten_free">Gluten Free</option>
              <option value="dairy_free">Dairy Free</option>
              <option value="dairy_free">Pescatarian</option>
              <option value="dairy_free">Ketogenic</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email Address</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="input input-bordered w-full"
              placeholder="Enter your email"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full text-white"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="loading loading-spinner loading-xs"></span>
            ) : (
              "GET MY MEAL PLAN"
            )}
          </button>
        </>
      )}
      {aiResult && (
        <div className="mt-6 p-4 bg-white rounded shadow text-gray-800 whitespace-pre-line">
          <button
            type="button"
            className="btn btn-primary px-4 py-2 text-white rounded block"
            onClick={() => setAiResult("")}
          >
            return
          </button>
          <h3 className="font-bold mb-2 text-lg text-center">AI Meal Plan</h3>
          <div>{aiResult}</div>
        </div>
      )}
    </form>
  );
};

export default DietPlanForm;