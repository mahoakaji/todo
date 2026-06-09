import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const todos = await prisma.todo.findMany({
      orderBy: { createdAt: 'asc' },
    })
    return NextResponse.json(todos)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch todos' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const todo = await prisma.todo.create({
      data: {
        text:     body.text,
        status:   body.status   ?? 'todo',
        urgent:   body.urgent   ?? false,
        deadline: body.deadline ?? null,
      },
    })
    return NextResponse.json(todo, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create todo' }, { status: 500 })
  }
}
