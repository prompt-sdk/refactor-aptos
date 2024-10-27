import { NextRequest, NextResponse } from 'next/server';
import { getTool, createApiTool, createContractTool, createWidgetTool } from '@/db/queries';
import { Tool } from '@/db/schema';

export async function GET(request: NextRequest) {
    const id = request.nextUrl.searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: 'Tool ID is required' }, { status: 400 });
    }

    try {
        const tool = await getTool(id);
        if (tool.length === 0) {
            return NextResponse.json({ error: 'Tool not found' }, { status: 404 });
        }
        return NextResponse.json(tool);
    } catch (error) {
        console.error('Error fetching tool:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { typeName, name, description, userId, ...otherProps } = body;

        if (!typeName || !name || !description || !userId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        let result;

        const commonProps: Partial<Tool> = {
            id: crypto.randomUUID(),
            name,
            description,
            userId,
            typeName,
            createdAt: new Date(),
            params: null,
            type_params: null,
            functions: null,
            typeFunction: null,
            accessToken: null,
            spec: null,
            prompt: null,
            code: null,
            toolWidget: null,
        };

        switch (typeName) {
            case 'apiTool':
                const { accessToken, spec } = otherProps;
                if (!accessToken || !spec) {
                    return NextResponse.json({ error: 'Missing required fields for API tool' }, { status: 400 });
                }
                result = await createApiTool({
                    ...commonProps,
                    accessToken,
                    spec,
                    } as Tool
                );
                break;

            case 'contractTool':
                const { params, typeFunction, functions } = otherProps;
                if (!params || !typeFunction || !functions) {
                    return NextResponse.json({ error: 'Missing required fields for Contract tool' }, { status: 400 });
                }
                result = await createContractTool({
                    ...commonProps,
                    params,
                    typeFunction,
                    functions,
                } as Tool);
                break;

            case 'widgetTool':
                const { prompt, code, toolWidget } = otherProps;
                if (!prompt || !code || !toolWidget) {
                    return NextResponse.json({ error: 'Missing required fields for Widget tool' }, { status: 400 });
                }
                result = await createWidgetTool({
                    ...commonProps,
                    prompt,
                    code,
                    toolWidget,
                    } as Tool
                );
                break;

            default:
                return NextResponse.json({ error: 'Invalid tool type' }, { status: 400 });
        }

        return NextResponse.json({ message: 'Tool created successfully', result });
    } catch (error) {
        console.error('Error creating tool:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}