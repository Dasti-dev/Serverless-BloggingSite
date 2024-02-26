import { Hono } from 'hono'
import userRouter from './routes/user'
import { blogRouter } from './routes/blog'
import { verify } from "hono/jwt";


const app = new Hono<{
    Bindings: {
      DATABASE_URL: string;
      JWT_SECRET: string;
  },
    Variables: {
      userId: string
  }
}>()

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.use('/api/v1/blog/*', async (c, next) => {
  try {
    const jwt = c.req.header('Authorization');
    if (!jwt) {
      c.status(401)
      return c.json({ error: "Unauthorized: Missing Authorization header" });
    }
    
    const tokenParts = jwt.split(' ');
    if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
      c.status(401)
      return c.json({ error: "Unauthorized: Invalid token format" });
    }
    
    const token = tokenParts[1];
    const payload = await verify(token, c.env.JWT_SECRET);
    if (!payload) {
      c.status(401)
      return c.json({ error: "Unauthorized: Invalid token" });
    }
    
    c.set('userId', payload.id);
    await next();
  } catch (error) {
    console.error('Error in auth middleware:', error);
    c.status(500)
    return c.json({ error: "Internal Server Error" });
  }
});


app.route('/api/v1/user',userRouter);
app.route('api/v1/blog',blogRouter);

export default app
