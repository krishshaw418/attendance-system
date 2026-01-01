interface Session {
    classId: string;
    startedAt: String;
    attendance: Map<string, string>
}

declare var activeSession: Session; 