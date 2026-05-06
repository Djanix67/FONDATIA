type TransactionalEmailInput = {
  to: string
  subject: string
  html: string
}

async function sendWithResend({ to, subject, html }: TransactionalEmailInput) {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM

  if (!apiKey || !from) {
    return {
      delivered: false,
      reason: "Email provider not configured",
    }
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      html,
    }),
  })

  if (!response.ok) {
    throw new Error("Envoi email transactionnel impossible.")
  }

  return {
    delivered: true,
  }
}

export async function sendTransactionalEmail(input: TransactionalEmailInput) {
  return sendWithResend(input)
}
