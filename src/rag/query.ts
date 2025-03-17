import { Index as UpstashIndex } from '@upstash/vector'
import { OpenAIEmbeddings } from '@langchain/openai'

// Initialize Upstash Vector client
const index = new UpstashIndex({
  url: process.env.UPSTASH_VECTOR_REST_URL as string,
  token: process.env.UPSTASH_VECTOR_REST_TOKEN as string,
})

type MovieMetadata = {
  title?: string
  year?: string
  genre?: string
  director?: string
  actors?: string
  rating?: string
  votes?: string
  revenue?: string
  metascore?: string
}

export async function queryMovies(query: string) {
  // Create embeddings instance
  const embeddings = new OpenAIEmbeddings({
    model: "text-embedding-ada-002"
  })

  // Generate embedding for the query
  const embedding = await embeddings.embedQuery(query)
  
  // Search using the generated embedding vector
  const results = await index.query({
    vector: embedding,  // Use the embedding vector, not the text
    topK: 5,
    includeMetadata: true
  })
  
  return results
}
