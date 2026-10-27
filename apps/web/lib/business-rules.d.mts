export declare const MAX_PROVIDERS_PER_REQUEST: number;
export declare function matchingSlots(existingCount: number): number;
export declare function canSubmitOffer(args: {role:string;providerStatus:string;matched:boolean;requestStatus:string}): boolean;
export declare function canAcceptOffer(args: {role:string;ownedByClient:boolean;offerStatus:string;requestStatus:string}): boolean;
