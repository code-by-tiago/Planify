const { createClient } = require("@supabase/supabase-js");
const { getArg, loadPlanifyEnv, requireEnv } = require("./_env.cjs");

loadPlanifyEnv(process.cwd());

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function getEmail() {
  return normalizeEmail(getArg("--email"));
}

async function stripeRequest(path) {
  const secretKey = requireEnv("STRIPE_SECRET_KEY");

  const response = await fetch(`https://api.stripe.com/v1${path}`, {
    headers: {
      Authorization: `Bearer ${secretKey}`,
    },
  });

  const json = await response.json();

  if (!response.ok) {
    throw new Error(json.error?.message || "Erro ao consultar Stripe.");
  }

  return json;
}

function unixToISOString(value) {
  if (!value) {
    return null;
  }

  return new Date(value * 1000).toISOString();
}

async function findStripeCustomersByEmail(email) {
  const result = await stripeRequest(
    `/customers?email=${encodeURIComponent(email)}&limit=100`,
  );

  return result.data || [];
}

async function listSubscriptionsByCustomer(customerId) {
  const result = await stripeRequest(
    `/subscriptions?customer=${encodeURIComponent(customerId)}&status=all&limit=100`,
  );

  return result.data || [];
}

function getPriceId(subscription) {
  return subscription.items?.data?.[0]?.price?.id || null;
}

function chooseBestSubscription(subscriptions) {
  if (subscriptions.length === 0) {
    return null;
  }

  const priority = {
    active: 5,
    trialing: 4,
    past_due: 3,
    incomplete: 2,
    canceled: 1,
  };

  return subscriptions
    .slice()
    .sort((a, b) => {
      const statusA = priority[a.status] || 0;
      const statusB = priority[b.status] || 0;

      if (statusA !== statusB) {
        return statusB - statusA;
      }

      return (b.created || 0) - (a.created || 0);
    })[0];
}

async function findUserByEmail(supabase, email) {
  let page = 1;
  const perPage = 100;

  while (page <= 30) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) {
      throw new Error(error.message);
    }

    const user = data.users.find(
      (item) => normalizeEmail(item.email) === email,
    );

    if (user) {
      return user;
    }

    if (data.users.length < perPage) {
      return null;
    }

    page += 1;
  }

  return null;
}

async function main() {
  const email = getEmail();

  if (!email) {
    console.error("");
    console.error("Informe o e-mail do usuário:");
    console.error('node scripts\\planify\\stripe\\sincronizar-assinatura-email.cjs --email "professor@email.com"');
    process.exit(1);
  }

  const supabase = createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );

  console.log("");
  console.log("Planify | Sincronizar assinatura Stripe por e-mail");
  console.log(`E-mail: ${email}`);
  console.log("");

  const user = await findUserByEmail(supabase, email);

  if (!user) {
    console.error("Usuário não encontrado no Supabase Auth.");
    console.error("Crie a conta em /login com esse e-mail antes de sincronizar.");
    process.exit(1);
  }

  const customers = await findStripeCustomersByEmail(email);

  if (customers.length === 0) {
    console.error("Nenhum cliente Stripe encontrado com esse e-mail.");
    process.exit(1);
  }

  const allSubscriptions = [];

  for (const customer of customers) {
    const subscriptions = await listSubscriptionsByCustomer(customer.id);

    for (const subscription of subscriptions) {
      allSubscriptions.push({
        customer,
        subscription,
      });
    }
  }

  if (allSubscriptions.length === 0) {
    console.error("Cliente encontrado, mas sem assinatura Stripe.");
    process.exit(1);
  }

  const best = chooseBestSubscription(
    allSubscriptions.map((item) => item.subscription),
  );

  const matching = allSubscriptions.find(
    (item) => item.subscription.id === best.id,
  );

  const customer = matching.customer;
  const subscription = best;
  const priceId = getPriceId(subscription);
  const planKey =
    subscription.metadata?.plan_key ||
    subscription.metadata?.plan ||
    subscription.metadata?.tipo ||
    null;

  const row = {
    id: subscription.id,
    user_id: user.id,
    plan_id: planKey || priceId,
    plan_key: planKey,
    price_id: priceId,
    status: subscription.status || "incomplete",
    current_period_start: unixToISOString(subscription.current_period_start),
    current_period_end: unixToISOString(subscription.current_period_end),
    cancel_at_period_end: Boolean(subscription.cancel_at_period_end),
    canceled_at: unixToISOString(subscription.canceled_at),
    stripe_customer_id: customer.id,
    stripe_customer_email: email,
    stripe_subscription_id: subscription.id,
    last_stripe_event_type: "manual_sync_local",
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("subscriptions").upsert(row, {
    onConflict: "id",
  });

  if (error) {
    throw new Error(error.message);
  }

  console.log("Assinatura sincronizada com sucesso.");
  console.log("");
  console.log(`User ID: ${user.id}`);
  console.log(`Subscription: ${subscription.id}`);
  console.log(`Status: ${subscription.status}`);
  console.log(`Plano: ${planKey || priceId || "-"}`);
  console.log(`Fim do período: ${row.current_period_end || "-"}`);
  console.log("");
  console.log("Agora faça /sair, depois /login com esse usuário.");
}

main().catch((error) => {
  console.error("");
  console.error("Erro ao sincronizar assinatura:");
  console.error(error.message);
  process.exit(1);
});
