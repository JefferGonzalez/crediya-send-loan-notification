import {
  SESClient,
  SendEmailCommand,
  SendEmailCommandInput
} from '@aws-sdk/client-ses'
import { SQSEvent, SQSRecord } from 'aws-lambda'

export const handler = async (
  event: SQSEvent
): Promise<{ statusCode: number; body: string }> => {
  console.log('Received event:', JSON.stringify(event, null, 2))

  for (const record of event.Records) {
    await processRecord(record)
  }

  console.log('All records processed successfully.')

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'All records processed successfully.' })
  }
}

const processRecord = async (record: SQSRecord): Promise<void> => {
  try {
    console.log('Processing record:', record.messageId)

    const messageBody = JSON.parse(record.body)
    const { to, subject, body } = messageBody

    if (!to || !subject || !body) {
      throw new Error(
        'Invalid message format. "to", "subject", and "body" are required.'
      )
    }

    await sendEmail(to, subject, body)

    console.log(`Successfully processed record: ${record.messageId}`)
  } catch (error) {
    console.log(`Error processing record ${record.messageId}:`, error)
    throw error
  }
}

const sendEmail = async (
  to: string,
  subject: string,
  body: string
): Promise<void> => {
  const sesClient = new SESClient({ region: process.env.AWS_REGION })

  const params: SendEmailCommandInput = {
    Source: process.env.SES_SOURCE_EMAIL,
    Destination: {
      ToAddresses: [to]
    },
    Message: {
      Subject: {
        Charset: 'UTF-8',
        Data: subject
      },
      Body: {
        Text: {
          Charset: 'UTF-8',
          Data: body
        },
        Html: {
          Charset: 'UTF-8',
          Data: body
        }
      }
    }
  }

  const command = new SendEmailCommand(params)

  try {
    const response = await sesClient.send(command)

    console.log('Email sent successfully:', response.MessageId)
  } catch (error) {
    console.log('Error sending email:', error)
    throw error
  }
}
