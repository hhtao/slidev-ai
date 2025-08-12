export function toSseData(data: any) {
    return {
        data: JSON.stringify(data),
    }
}