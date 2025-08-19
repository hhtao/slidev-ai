import STATUS_CODE from "@/constant/status-code";

// 使用泛型以便约束 data 的类型
class BaseResponse<T = any> {
    code!: string;
    message!: string;
    data?: T;

    // 正确的 static 方法写法（推荐普通方法声明形式）
    static success<T = any>(data?: T, message = 'Success'): BaseResponse<T> {
        return {
            code: STATUS_CODE.SUCCESS,
            message,
            data,
        };
    }

    static error(code: string, message: string): BaseResponse<never> {
        return {
            code,
            message,
        };
    }
}

export default BaseResponse;
