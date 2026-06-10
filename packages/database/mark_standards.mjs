import { PrismaClient } from '@prisma/client'
import path from 'path'
import { fileURLToPath } from 'url'
import { readFileSync } from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Load DATABASE_URL from root .env if not set
if (!process.env.DATABASE_URL) {
  const envPath = path.join(__dirname, '../../.env')
  try {
    const envContent = readFileSync(envPath, 'utf-8')
    for (const line of envContent.split('\n')) {
      const [key, ...vals] = line.split('=')
      if (key && vals.length) {
        process.env[key.trim()] = vals.join('=').trim().replace(/^"|"$/g, '')
      }
    }
  } catch {}
}

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
})

async function main() {
  console.log('Marking standard recipes in the database...')
  const result = await prisma.recipe.updateMany({
    where: {
      name: {
        in: ['Frühstück (Standard)', 'Abendessen (Standard)']
      }
    },
    data: {
      isStandard: true
    }
  })
  console.log(`Successfully updated ${result.count} recipes to standard.`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
