declare module 'express' {
  import { IncomingMessage, ServerResponse } from 'http';
  
  export interface Request extends IncomingMessage {
    body?: any;
    params?: { [key: string]: string };
    query?: { [key: string]: string };
  }
  
  export interface Response extends ServerResponse {
    json(body: any): Response;
    status(code: number): Response;
  }
  
  export interface Application {
    use(middleware: any): Application;
    get(path: string, handler: (req: Request, res: Response) => void): void;
    post(path: string, handler: (req: Request, res: Response) => void): void;
    listen(port: number, callback?: () => void): void;
  }
  
  function express(): Application;
  export default express;
} 