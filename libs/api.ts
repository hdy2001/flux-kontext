import axios from "axios";
import { toast } from "react-hot-toast";
import { redirect } from "next/navigation";
import config from "@/config";

// use this to interact with our own API (/app/api folder) from the front-end side
// See https://shipfa.st/docs/tutorials/api-call
const apiClient = axios.create({
  baseURL: "/api",
});

// 响应拦截器 - 处理成功响应和错误
apiClient.interceptors.response.use(
  function (response) {
    // 成功响应，返回数据部分
    return response.data;
  },
  function (error) {
    let message = "";

    if (error.response?.status === 401) {
      // 用户未认证，要求重新登录
      toast.error("Please login");
      // 跳转到登录页面
      redirect(config.auth.loginUrl);
    } else if (error.response?.status === 403) {
      // 用户未授权，需要订阅/购买/选择计划
      message = "Pick a plan to use this feature";
    } else if (error.response?.status === 422) {
      // 特殊处理422错误，避免重复显示
      message = error?.response?.data?.error || "请求参数验证失败";
      console.error('Validation Error:', message);
      // 不自动显示toast，让具体的组件处理
      error.message = message;
      return Promise.reject(error);
    } else {
      message =
        error?.response?.data?.error || error.message || error.toString();
    }

    error.message =
      typeof message === "string" ? message : JSON.stringify(message);

    console.error(error.message);

    // 自动向用户显示错误（422错误除外）
    if (error.message && error.response?.status !== 422) {
      toast.error(error.message);
    } else if (!error.message) {
      toast.error("something went wrong...");
    }
    return Promise.reject(error);
  }
);

export default apiClient;
