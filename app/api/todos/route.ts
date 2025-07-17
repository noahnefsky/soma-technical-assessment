import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { searchPexelsImage } from '@/lib/pexels';

export async function GET() {
  try {
    const todos = await prisma.todo.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
    return NextResponse.json(todos);
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching todos' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { title, dueDate, dependencyIds, duration } = await request.json();
    if (!title || title.trim() === '') {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }
    
    // Validate dependencies if provided
    if (dependencyIds && Array.isArray(dependencyIds)) {
      // Check if all dependency IDs exist
      const existingTodos = await prisma.todo.findMany({
        where: { id: { in: dependencyIds } }
      });
      
      if (existingTodos.length !== dependencyIds.length) {
        return NextResponse.json({ error: 'One or more dependencies do not exist' }, { status: 400 });
      }
    }
    
    // Search for a relevant image based on the todo title
    const imageUrl = await searchPexelsImage(title);
    
    let processedDueDate = null;
    if (dueDate) {
      // Add time component to ensure it's treated as local time, not UTC
      processedDueDate = new Date(dueDate + 'T00:00');  }
    
    const todo = await prisma.todo.create({
      data: {
        title,
        dueDate: processedDueDate,
        imageUrl,
        dependencyIds: dependencyIds ? JSON.stringify(dependencyIds) : null,
        duration: duration || 1,
      },
    });
    return NextResponse.json(todo, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Error creating todo' }, { status: 500 });
  }
}