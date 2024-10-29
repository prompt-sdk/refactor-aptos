import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';
import { z } from 'zod';
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getAptosClient() {
  const config = new AptosConfig({ network: Network.TESTNET });
  return new Aptos(config);
}

interface Item {
  tool: {
    data: string;
    accessToken: string;
  };
}

interface Tool {
  description: string;
  parameters: any;
  generate: (
    payload: any
  ) => AsyncGenerator<JSX.Element, { data: string; node: JSX.Element }, void>;
}
interface Item {
  tool: {
    data: string;
    accessToken: string;
  };
}

interface Tool {
  description: string;
  parameters: any;
  generate: (
    payload: any
  ) => AsyncGenerator<JSX.Element, { data: string; node: JSX.Element }, void>;
}

const convertSchemaToParams = (param: any): any => {
  if (!param.type) {
    return Object.keys(param).reduce(
      (acc, key) => {
        acc[key] = convertSchemaToParams(param[key]);
        return acc;
      },
      {} as Record<string, any>
    );
  }

  switch (param.type) {
    case 'string':
      return z.string().describe(param.description);
    case 'integer':
      return z.number().describe(param.description);
    case 'boolean':
      return z.boolean().describe(param.description);
    case 'array':
      return z.array(convertSchemaToParams(param.items));
    case 'object':
      return z.object(convertSchemaToParams(param.properties));
    default:
      console.warn('Unsupported type', param.type);
      return z.string().describe('unknown description');
  }
};

const getParametersFromSchema = (schema: any) => {
  return schema.parameters
    ? z.object(
        schema.parameters.reduce((acc: any, param: any) => {
          acc[param.name] = convertSchemaToParams(param.schema || {});
          return acc;
        }, {})
      )
    : z.object({});
};

export const parseRequestBody = (methodSchema: any, itemTool: any) => {
  let parameters;
  let typeRequest = '';

  if (methodSchema.requestBody) {
    const { content } = methodSchema.requestBody;
    const schemaRef = content?.['application/json']?.schema['$ref']
      ?.split('/')
      .pop();

    if (content?.['application/json']) {
      typeRequest = 'application/json';
      parameters = itemTool.components.schemas[schemaRef] || {};
    } else if (content?.['application/octet-stream']) {
      typeRequest = 'application/octet-stream';
      parameters = content['application/octet-stream'].schema;
    } else if (content?.['application/x-www-form-urlencoded']) {
      typeRequest = 'application/x-www-form-urlencoded';
      parameters = content['application/x-www-form-urlencoded'].schema;
    }
    parameters = convertSchemaToParams(parameters);
  } else {
    parameters = getParametersFromSchema(methodSchema);
  }

  return { parameters, typeRequest };
};

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

// Function to replace placeholders in a URL template with actual values from params
export function fillUrl(template: string, params: Record<string, any>): string {
  return template.replace(/{(\w+)}/g, (_, key) => params[key] || '');
}

// Type for request options
interface ApiRequestOptions {
  method: string;
  headers: Record<string, string>;
  body?: string | FormData;
}

// Main function to make API requests
export async function makeRequest(
  accessToken: string,
  endpoint: string,
  payload: Record<string, any> | null = null,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'parameters' | 'PATCH' = 'GET',
  typeRequest:
    | 'application/json'
    | 'application/octet-stream'
    | 'application/x-www-form-urlencoded' = 'application/json'
): Promise<any> {
  // Handle URL parameters if method is "parameters"
  if (method === 'parameters') {
    endpoint = fillUrl(endpoint, payload || {});
    console.log('Final endpoint with parameters:', endpoint);
  }

  // Set up request headers
  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    Accept: 'application/json',
  };

  // Set up request options
  const options: ApiRequestOptions = {
    method,
    headers,
  };

  // Configure body based on the request type
  if (typeRequest === 'application/json') {
    headers['Content-Type'] = 'application/json';
    if (payload) {
      options.body = JSON.stringify(payload);
    }
  } else if (typeRequest === 'application/octet-stream') {
    headers['Content-Type'] = 'application/octet-stream';
    if (payload) {
      options.body = JSON.stringify(payload); // Assuming payload is already a Blob or Buffer
    }
  } else if (typeRequest === 'application/x-www-form-urlencoded') {
    headers['Content-Type'] = 'application/x-www-form-urlencoded';
    if (payload) {
      const urlEncodedData = new URLSearchParams(payload).toString();
      options.body = urlEncodedData;
    }
  }

  // Make the API request
  try {
    const response = await fetch(endpoint, options);

    // Handle non-OK responses
    if (!response.ok) {
      const errorMessage =
        response.status === 401
          ? 'Unauthorized: Invalid or expired token.'
          : `Error: ${response.status} ${response.statusText}`;
      return { err: errorMessage };
    }

    // Parse and return the response data
    return await response.json();
  } catch (error) {
    console.error('Failed to make API request:', error);
    return `Failed to make API request: ${error}`;
  }
}
