interface Session {
    classId: string;
    startedAt: String;
    attendance: Map<string, "present" | "absent">
}

declare var activeSession: Session | null; 
declare var present: number;
declare var absent: number;
declare var total: number;