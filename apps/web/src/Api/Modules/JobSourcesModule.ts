import { Module } from "@nestjs/common";
import { InfrastructureModule } from "../../Infrastructure/InfrastructureModule";
import { JobSourcesController } from "../Controllers/JobSourcesController";

@Module({
    imports: [InfrastructureModule],
    controllers: [JobSourcesController],
})
export class JobSourcesModule {}
