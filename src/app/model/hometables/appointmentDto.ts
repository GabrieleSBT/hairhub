export interface AppointmentDto{
    id: number;
    userId: number;
    barberId:number;
    barberName: string;
    date: string;
    startTime: string;
    endTime: string;
    status: string;
    treatments:number[];
} 
