import { ICandidateProfile } from "../../Domain/Candidates/ICandidateProfile";

export interface IJobCandidateProfileService {
    createCandidateProfile(profileData: ICandidateProfile): Promise<ICandidateProfile>;
    getCandidateProfileById(id: string): Promise<ICandidateProfile>;
    getCandidateProfiles(): Promise<ICandidateProfile[]>;

    /** Temporary until we have UI managed candidate profiles with
     *  Use this to seed default json into db
     **/
    seedCandidateProfilesWithDefault(): Promise<void>;
}
