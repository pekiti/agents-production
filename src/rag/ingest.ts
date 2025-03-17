import 'dotenv/config'
import { Index as UpstashVector } from '@upstash/vector'
import { parse } from 'csv-parse/sync'
import fs from 'fs'
import path from 'path'
import ora from 'ora'
import { OpenAIEmbeddings } from '@langchain/openai'

// Function to index IMDB movie data
export async function indexMovieData() {
  const spinner = ora('Reading movie data...').start()

  // Initialize Upstash Vector client
  const vectorIndex = new UpstashVector({
    url: process.env.UPSTASH_VECTOR_REST_URL as string,
    token: process.env.UPSTASH_VECTOR_REST_TOKEN as string
  })

  // Create embeddings instance
  const embeddings = new OpenAIEmbeddings({
    model: "text-embedding-ada-002"
  })

  // Read and parse CSV file
  const csvPath = path.join(process.cwd(), 'src/rag/documents/imdb_movie_dataset.csv')
  const csvData = fs.readFileSync(csvPath, 'utf-8')
  const records = parse(csvData, {
    columns: true,
    skip_empty_lines: true,
  })

  spinner.text = 'Starting movie indexing...'

  try {
    // Index each movie
    for (const movie of records) {
      spinner.text = `Indexing movie: ${movie.Title}`
      const text = `${movie.Title}. ${movie.Genre}. ${movie.Description}`
      
      // Generate embedding using OpenAI
      const embedding = await embeddings.embedQuery(text)
      
      // Store in Upstash Vector (providing the vector explicitly)
      await vectorIndex.upsert({
        id: movie.Title,
        vector: embedding,
        metadata: {
          title: movie.Title,
          year: movie.Year,
          genre: movie.Genre,
          director: movie.Director,
          actors: movie.Actors,
          rating: movie.Rating,
          votes: movie.Votes,
          revenue: movie.Revenue,
          metascore: movie.Metascore,
        }
      })
    }

    spinner.succeed('Successfully indexed movie data')
  } catch (error) {
    spinner.fail('Error indexing documents')
    console.error(error)
  }
}

indexMovieData()
