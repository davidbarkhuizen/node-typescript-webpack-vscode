export {}

declare global {
    interface Window { 
        fdg: any;
        state: any;
        timerTickWorker: Worker; 
        timerTickWorkerStarted: boolean;
        Worker: boolean;
    }
}