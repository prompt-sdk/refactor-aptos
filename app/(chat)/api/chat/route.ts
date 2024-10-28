import { convertToCoreMessages, Message, streamText, generateId } from 'ai';
import { z } from 'zod';
import { getAptosClient } from '@/components/utils/utils';
import { customModel } from '@/ai';
import { auth } from '@/app/(auth)/auth';
import { deleteChatById, getChatById, saveChat, getTools } from '@/db/queries';
import { Agent } from '@/db/schema';

import { Model, models } from '@/lib/model';
import { Tool } from '@langchain/core/tools';

export const aptosClient = getAptosClient();

export const zodExtract = (type: any, describe: any) => {
  if (type == 'u128') return z.number().describe(describe);
  if (type == 'u64') return z.number().describe(describe);
  if (type == 'u8') return z.number().describe(describe);
  if (type == 'bool') return z.boolean().describe(describe);
  if (type == 'address') return z.string().describe(describe);
  if (type == 'vector<u8>') return z.string().describe(describe);
  if (type == 'vector<address>') return z.array(z.string()).describe(describe);
  if (type == 'vector<string::String>')
    return z.array(z.string()).describe(describe);
  if (type == '0x1::string::String')
    return z.array(z.string()).describe(describe);
  if (type == 'generic')
    return z.string().describe(' address type like 0x1::ABC::XYZ');
  if (type == 'Type')
    return z.string().describe(' address type like 0x1::ABC::XYZ');
  if (type == 'TypeInfo')
    return z.string().describe(' address type like 0x1::ABC::XYZ');
  return z.string().describe(describe);
};
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

  const session = await auth();

  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }

  if (!models.find((m) => m.name === model)) {
    return new Response('Model not found', { status: 404 });
  }

  let toolData: Tool[];
  toolData = tools.reduce((tool: any, item: any) => {
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
      type ParametersData = z.infer<typeof ParametersSchema>;
      //https://www.youtube.com/watch?v=ZmPGr1WHS_s
      tool[item.typeName + '_' + generateId()] = {
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
            // add try catch
            console.log(data);
            try {
              const [res] = await aptosClient.view({ payload: data });
              console.log(res);
              return `${JSON.stringify(res)}`;
            } catch (error) {
              console.log(error);
              return JSON.stringify(error);
            }

            // should use text generation
          }
          return 'dont know';
        },
      };
      //if view return data
      return tool;
    }
  }, []);

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
