import { Hono } from 'hono';
import { PrismaClient } from '@prisma/client/edge';
import { withAccelerate } from '@prisma/extension-accelerate';

export const blogRouter = new Hono<{
    Bindings: {
        DATABASE_URL: string;
        JWT_SECRET: string;
    },
    Variables: {
        userId: string,
    }
}>();

blogRouter.post('/post', async (c) => {
    const userId = c.get('userId');
    const prisma = new PrismaClient({
        datasourceUrl: c.env?.DATABASE_URL,
    }).$extends(withAccelerate());
    try {
        const body = await c.req.json();
        const post = await prisma.post.create({
            data: {
                title: body.title,
                content: body.content,
                authorId: userId
            }
        });
        return c.json({ id: post.id });
    } catch (error) {
        console.error('Error creating post:', error);
        c.status(500)
        return c.json({ error: "Error creating post" });
    }
});

blogRouter.put('/update', async (c) => {
    const userId = await c.get('userId');
    const prisma = new PrismaClient({
        datasourceUrl: c.env?.DATABASE_URL,
    }).$extends(withAccelerate());
    try {
        const body = await c.req.json();
        await prisma.post.update({
            where: {
                id: body.id,
                authorId: userId
            },
            data: {
                title: body.title,
                content: body.content
            }
        });
        return c.text('Post updated successfully');
    } catch (error) {
        console.error('Error updating post:', error);
        c.status(500);
        return c.json({ error: "Error updating post" });
    }
});

blogRouter.get('get/:id', async (c) => {
    console.log('reached get id route')
    const id = c.req.param('id');
    const prisma = new PrismaClient({
        datasourceUrl: c.env?.DATABASE_URL,
    }).$extends(withAccelerate());
    try {
        const post = await prisma.post.findUnique({
            where: {
                id
            }
        });
        if (!post) {
            c.status(404)
            return c.json({ error: "Post not found" });
        }
        return c.json(post);
    } catch (error) {
        console.error('Error fetching post:', error);
        c.status(500)
        return c.json({ error: "Error fetching post" });
    }
});
