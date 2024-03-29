import { Hono } from 'hono';
import { PrismaClient } from '@prisma/client/edge';
import { withAccelerate } from '@prisma/extension-accelerate';
import { sign } from "hono/jwt";
import { signinInput, signupInput } from "@dasti-dev/common"

export const userRouter = new Hono<{
    Bindings: {
        DATABASE_URL: string;
        JWT_SECRET: string;
    }
}>();

userRouter.post('/signup', async (c) => {
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());

    const body = await c.req.json();
    const { success } = signupInput.safeParse(body);

    if(!success) {
        c.status(400);
        return c.json({ error: "Invalid Input" });
    }

    try {
        const existingUser = await prisma.user.findUnique({
            where: {
                email: body.email
            }
        });

        if (existingUser) {
            c.status(409)
            return c.json({ error: "User already exists" });
        }

        const user = await prisma.user.create({
            data: {
                email: body.email,
                password: body.password,
            },
        });

        const token = await sign({ id: user.id }, c.env.JWT_SECRET);

        return c.json({ jwt: token });
    } catch (error) {
        console.error('Error while signing up:', error);
        c.status(403)
        return c.json({ error: "Error while signing up" });
    }
});

userRouter.post('/signin', async (c) => {
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());

    const body = await c.req.json();

    const { success } = signinInput.safeParse(body);
    if(!success) {
        c.status(400);
        return c.json({ error: "Invalid Input" })
    }

    try {
        const user = await prisma.user.findUnique({
            where: {
                email: body.email,
                password: body.password
            }
        });

        if (!user) {
            c.status(401)
            return c.json({ error: 'Invalid credentials' });
        }

        const token = await sign({ id: user.id }, c.env.JWT_SECRET);
        return c.json({ jwt: token });
    } catch (error) {
        console.error('Error while signing in:', error);
        c.status(403)
        return c.json({ error: "Error while signing in" });
    }
});

export default userRouter;