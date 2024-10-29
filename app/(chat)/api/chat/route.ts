import { convertToCoreMessages, Message, streamText, generateId } from 'ai';
import { z, ZodObject } from 'zod';
import { getAptosClient } from '@/components/utils/utils';
import { customModel } from '@/ai';
import { auth } from '@/app/(auth)/auth';
import { deleteChatById, getChatById, saveChat } from '@/db/queries';
import { Agent } from '@/db/schema';

import { Model, models } from '@/lib/model';
import {
  zodExtract,
  parseRequestBody,
  makeRequest,
} from '@/components/utils/utils';

type ParametersData = Record<string, any>; // Define the shape of ParametersData based on your requirements

// Schema for the `tool` object entries
interface ToolEntry {
  description: string;
  parameters: ZodObject<any>; // This can be refined to match `ParametersSchema` type
  execute: (ParametersData: ParametersData) => Promise<string>;
}
type ToolKey = `${string}_${string}_${string}`;
type Tool = Record<ToolKey, ToolEntry>;

export async function POST(request: Request) {
  const {
    id,
    messages,
    model,
    agent,
    tools,
  }: {
    id: string;
    messages: Array<Message>;
    model: Model['name'];
    agent: Agent;
    tools: Tool[];
  } = await request.json();
  const aptosClient = getAptosClient();

  const session = await auth();

  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }

  if (!models.find((m) => m.name === model)) {
    return new Response('Model not found', { status: 404 });
  }

  const toolData = tools.reduce((tool: any, item: any) => {
    if (item.typeName == 'contractTool') {
      const filteredObj = Object.keys(item.params).reduce(
        (acc: any, key: any) => {
          acc[key] = key = zodExtract(
            item.params[key].type,
            item.params[key].description
          );
          return acc;
        },
        {}
      );
      const ParametersSchema: any = Object.fromEntries(
        Object.entries(filteredObj).filter(
          ([key, value]) => value !== undefined
        )
      );

      // tool[item.typeName + '_' + generateId()] = {
      //   description: 'Get aptos address',
      //   parameters: z.object({}),
      //   execute: async () => {
      //     return 'aptos address : 0x1::aptos_coin::AptosCoin';
      //   },
      // };
      tool[item.typeName + '_' + item.typeFunction + '_' + generateId()] = {
        description: item.description,
        parameters: z.object(ParametersSchema),
        execute: async (ParametersData: ParametersData) => {
          const filteredObj = Object.entries(ParametersData)
            .filter(([key, value]) => key !== 'CoinType')
            .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

          const filteredObjCointype = Object.keys(ParametersData)
            .filter((key) => key === 'CoinType')
            .reduce((acc, key) => ({ ...acc, [key]: ParametersData[key] }), {});

          const data: any = {
            functionArguments: Object.values(filteredObj).map((item: any) =>
              typeof item === 'number' ? BigInt(item * 10 ** 18) : item
            ),
            function: item.name,
            typeArguments: Object.values(filteredObjCointype),
          };
          if (item.typeFunction == 'entry') {
            return JSON.stringify(data);
          }
          if (item.typeFunction == 'view') {
            

            try {
              const res = await aptosClient.view({ payload: data });
              console.log('res', res);
              return `data: ${JSON.stringify(res)} `;
            } catch (error) {
              console.log(error);
              return `data: ${JSON.stringify(error)} `;
            }

            // should use text generation
          }
          return 'dont know';
        },
      };
      //if view return data
    }
    if (item.typeName == 'widgetTool') {
      tool[item.typeName + '_' + item.typeFunction + '_' + generateId()] = {
        description: item.description,
        parameters: z.object({}),
        execute: async (testParams: any) => {
          return item.code;
        },
      };
    }
    if (item.typeName == 'apiTool') {
      const spec = JSON.parse(item.spec);
      const apiHost = spec.servers[0].url;
      for (const path in spec.paths) {
        const endpoint = `${apiHost}${path}`;
        for (const method in spec.paths[path]) {
          const methodSchema = spec.paths[path][method];
          const description =
            methodSchema.summary || 'No description available';

          const { parameters, typeRequest } = parseRequestBody(
            methodSchema,
            spec
          );
          tool[item.typeName + '_' + path + '_' + generateId()] = {
            description: description,
            parameters,
            execute: async (payload: any) => {
              const res = await makeRequest(
                item.accessToken,
                endpoint,
                payload,
                method as any,
                typeRequest as any
              );
              return JSON.stringify(res);
            },
          };
        }
      }
    }
    return tool;
  }, {});

  const coreMessages = convertToCoreMessages(messages);
  const result = await streamText({
    model: customModel(model),
    system: `Your name is ${agent.name} \n\n
       Your desciption is ${agent.description} \n\n
      ${agent.prompt}`,
    messages: coreMessages,
    maxSteps: 5,
    tools: toolData as any,
    onFinish: async ({ responseMessages }) => {
      if (session.user && session.user.id) {
        try {
          await saveChat({
            id,
            messages: [...coreMessages, ...responseMessages],
            userId: session.user.id,
            agentId: agent.id,
          });
        } catch (error) {
          console.error('Failed to save chat');
        }
      }
    },
    experimental_telemetry: {
      isEnabled: true,
      functionId: 'stream-text',
    },
  });

  return result.toDataStreamResponse({});
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new Response('Not Found', { status: 404 });
  }

  const session = await auth();

  if (!session || !session.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const chat = await getChatById({ id });

    if (chat.userId !== session.user.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    await deleteChatById({ id });

    return new Response('Chat deleted', { status: 200 });
  } catch (error) {
    return new Response('An error occurred while processing your request', {
      status: 500,
    });
  }
}
