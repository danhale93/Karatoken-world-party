import { Router } from 'express';

declare module './routes/genre' {
  const genreRouter: Router;
  export default genreRouter;
}

declare module './routes/youtube' {
  const youtubeRouter: Router;
  export default youtubeRouter;
}
