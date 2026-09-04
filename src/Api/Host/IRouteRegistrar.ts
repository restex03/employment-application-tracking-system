import { FastifyInstance } from "fastify";

export interface IRouteRegistrar {
    register(server: FastifyInstance): void;
}
