import { Router } from 'express';

declare module '*/routes/genre' {
  const router: Router;
  export default router;
}

declare module '*/routes/youtube' {
  const router: Router;
  export default router;
}
