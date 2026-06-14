export const SOCKET_EVENTS = {
    CONNECTION: "connection",
    DISCONNECT: "disconnect",
    JOIN_SERVICE: "service:join",
    LEAVE_SERVICE: "service:leave",
    METRIC_CREATED: "metric:created",
    LOG_CREATED: "log:created",
    DEPLOYMENT_CREATED: "deployment:created",
};
export const getServiceRoom = (serviceId) => {
    return `service:${serviceId}`;
};
