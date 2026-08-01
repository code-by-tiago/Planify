type StripeRequestOptions = {
  method?: "GET" | "POST";
  body?: URLSearchParams;
};

function getStripeSecretKey(): string {
  const key = process.env.STRIPE_SECRET_KEY;

  if (!key) {
    throw new Error("STRIPE_SECRET_KEY não configurada no .env.local.");
  }

  return key;
}

export async function stripeApiRequest<T>(
  path: string,
  options: StripeRequestOptions = {},
): Promise<T> {
  const secretKey = getStripeSecretKey();

  const response = await fetch(`https://api.stripe.com/v1${path}`, {
    method: options.method || "GET",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      ...(options.body
        ? {
            "Content-Type": "application/x-www-form-urlencoded",
          }
        : {}),
    },
    body: options.body,
  });

  const json = (await response.json()) as T & {
    error?: {
      message?: string;
    };
  };

  if (!response.ok) {
    throw new Error(json.error?.message || "Erro ao consultar API da Stripe.");
  }

  return json;
}
