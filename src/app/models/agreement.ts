import { Permission } from "./permission";

export interface Agreement { 
    '@id': string;
    assigner: string ;
    assignee: string ;
    target: string ;
    timestamp: string ;
    permission: [Permission] ;
    currentCount: number
}