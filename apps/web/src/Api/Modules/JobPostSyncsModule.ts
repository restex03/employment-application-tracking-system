import { Module } from "@nestjs/common";
import { InfrastructureModule } from "../../Infrastructure/InfrastructureModule";
import { JobPostSyncsController } from "../Controllers/JobPostSyncsController";

@Module({
    imports: [InfrastructureModule],
    controllers: [JobPostSyncsController],
})
export class JobPostSyncsModule {}
