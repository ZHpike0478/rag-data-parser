import JSZip from 'jszip';
import { RagChunk, VectorStoreTarget } from '../types/rag';

export class RagExporter {
  /**
   * Export chunks into desired payload string
   */
  static formatChunks(chunks: RagChunk[], target: VectorStoreTarget): string {
    switch (target) {
      case 'jsonl':
        return chunks
          .map(c => JSON.stringify({
            id: c.id,
            text: c.content,
            metadata: {
              ...c.metadata,
              document_id: c.documentId,
              document_name: c.documentName,
              tokens: c.tokenCount,
              characters: c.charCount,
              section: c.sectionBreadcrumbs?.join(' > ') || '',
              keywords: c.keywords
            }
          }))
          .join('\n');

      case 'json':
        return JSON.stringify(
          chunks.map(c => ({
            id: c.id,
            text: c.content,
            metadata: {
              ...c.metadata,
              document_name: c.documentName,
              tokens: c.tokenCount,
              section: c.sectionBreadcrumbs?.join(' > ') || '',
              keywords: c.keywords
            }
          })),
          null,
          2
        );

      case 'csv': {
        const headers = ['id', 'document_name', 'tokens', 'section', 'keywords', 'content'];
        const rows = chunks.map(c => {
          const escapeCsv = (val: string | number) => `"${String(val).replace(/"/g, '""')}"`;
          return [
            escapeCsv(c.id),
            escapeCsv(c.documentName),
            c.tokenCount,
            escapeCsv(c.sectionBreadcrumbs?.join(' > ') || ''),
            escapeCsv(c.keywords.join(', ')),
            escapeCsv(c.content)
          ].join(',');
        });
        return [headers.join(','), ...rows].join('\n');
      }

      case 'pinecone':
        // Pinecone Upsert Vector structure
        return JSON.stringify({
          vectors: chunks.map(c => ({
            id: c.id,
            values: [/* 1536-dim or 3072-dim embeddings placeholder */],
            metadata: {
              text: c.content,
              source: c.documentName,
              tokens: c.tokenCount,
              chunk_index: c.index,
              section: c.sectionBreadcrumbs?.join(' > ') || 'General'
            }
          }))
        }, null, 2);

      case 'chroma':
        // ChromaDB batch format
        return JSON.stringify({
          ids: chunks.map(c => c.id),
          documents: chunks.map(c => c.content),
          metadatas: chunks.map(c => ({
            source: c.documentName,
            tokens: c.tokenCount,
            chunk_index: c.index,
            section: c.sectionBreadcrumbs?.join(' > ') || ''
          }))
        }, null, 2);

      case 'qdrant':
        // Qdrant points format
        return JSON.stringify({
          points: chunks.map((c, i) => ({
            id: i + 1,
            vector: [/* embedding vector */],
            payload: {
              chunk_id: c.id,
              text: c.content,
              source: c.documentName,
              tokens: c.tokenCount,
              keywords: c.keywords
            }
          }))
        }, null, 2);

      case 'supabase':
        // Supabase / pgvector SQL migration script
        return `-- Supabase pgvector table definition & chunk seed data
create extension if not exists vector;

create table if not exists rag_documents (
  id text primary key,
  content text not null,
  tokens integer,
  metadata jsonb,
  embedding vector(1536)
);

-- Seed records
` + chunks.map(c => {
          const escapedContent = c.content.replace(/'/g, "''");
          const metaJson = JSON.stringify({
            source: c.documentName,
            chunk_index: c.index,
            tokens: c.tokenCount,
            section: c.sectionBreadcrumbs?.join(' > ') || ''
          }).replace(/'/g, "''");
          return `insert into rag_documents (id, content, tokens, metadata) values ('${c.id}', '${escapedContent}', ${c.tokenCount}, '${metaJson}');`;
        }).join('\n');

      case 'langchain':
      case 'llamaindex':
      default:
        return this.formatChunks(chunks, 'jsonl');
    }
  }

  /**
   * Code snippet templates for Python & TypeScript developers
   */
  static generateCodeSnippet(target: VectorStoreTarget, datasetName: string = 'rag_dataset.jsonl'): string {
    switch (target) {
      case 'pinecone':
        return `# Ingest into Pinecone Vector Database with OpenAI Embeddings
import json
from pinecone import Pinecone
from openai import OpenAI

pc = Pinecone(api_key="YOUR_PINECONE_KEY")
index = pc.Index("enterprise-rag")
client = OpenAI(api_key="YOUR_OPENAI_KEY")

with open("${datasetName}", "r") as f:
    chunks = json.load(f)["vectors"]

# Generate real embeddings and upsert
batch = []
for item in chunks:
    text = item["metadata"]["text"]
    res = client.embeddings.create(input=text, model="text-embedding-3-small")
    item["values"] = res.data[0].embedding
    batch.append(item)

index.upsert(vectors=batch)
print(f"Upserted {len(batch)} chunks into Pinecone!")`;

      case 'chroma':
        return `# ChromaDB Ingestion Script
import json
import chromadb
from chromadb.utils import embedding_functions

chroma_client = chromadb.Client()
openai_ef = embedding_functions.OpenAIEmbeddingFunction(
    api_key="YOUR_OPENAI_KEY",
    model_name="text-embedding-3-small"
)

collection = chroma_client.create_collection(
    name="rag_collection",
    embedding_function=openai_ef
)

with open("${datasetName}", "r") as f:
    data = json.load(f)

collection.add(
    ids=data["ids"],
    documents=data["documents"],
    metadatas=data["metadatas"]
)
print(f"Successfully indexed {len(data['ids'])} chunks in ChromaDB!")`;

      case 'supabase':
        return `# Python LangChain with Supabase pgvector
from langchain_community.vectorstores import SupabaseVectorStore
from langchain_openai import OpenAIEmbeddings
from supabase.client import create_client

supabase = create_client("YOUR_SUPABASE_URL", "YOUR_SUPABASE_SERVICE_KEY")
embeddings = OpenAIEmbeddings(model="text-embedding-3-small")

vector_store = SupabaseVectorStore(
    client=supabase,
    embedding=embeddings,
    table_name="rag_documents",
    query_name="match_documents"
)
print("Ready to run similarity search queries!")`;

      case 'llamaindex':
        return `# LlamaIndex Ingestion
import json
from llama_index.core.schema import TextNode
from llama_index.core import VectorStoreIndex

nodes = []
with open("${datasetName}", "r") as f:
    for line in f:
        item = json.loads(line)
        nodes.append(TextNode(
            text=item["text"],
            id_=item["id"],
            metadata=item["metadata"]
        ))

index = VectorStoreIndex(nodes)
query_engine = index.as_query_engine()
response = query_engine.query("What is the refund policy?")
print(response)`;

      case 'langchain':
      default:
        return `# Python LangChain Document Loader
import json
from langchain_core.documents import Document
from langchain_community.vectorstores import FAISS
from langchain_openai import OpenAIEmbeddings

docs = []
with open("${datasetName}", "r") as f:
    for line in f:
        item = json.loads(line)
        docs.append(Document(
            page_content=item["text"],
            metadata=item["metadata"]
        ))

db = FAISS.from_documents(docs, OpenAIEmbeddings())
results = db.similarity_search("How to authenticate API?", k=3)
for doc in results:
    print(f"Score match: {doc.page_content[:120]}...")`;
    }
  }

  /**
   * Trigger direct browser download of formatted file
   */
  static downloadFile(content: string, filename: string, mimeType: string = 'text/plain') {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Download a full ZIP bundle containing JSONL, JSON, CSV, and Readme
   */
  static async downloadZipBundle(chunks: RagChunk[], baseName: string = 'rag_dataset') {
    const zip = new JSZip();

    // 1. JSONL dataset
    zip.file(`${baseName}.jsonl`, this.formatChunks(chunks, 'jsonl'));

    // 2. Formatted JSON array
    zip.file(`${baseName}.json`, this.formatChunks(chunks, 'json'));

    // 3. CSV dataset
    zip.file(`${baseName}.csv`, this.formatChunks(chunks, 'csv'));

    // 4. Pinecone payload
    zip.file(`pinecone_payload.json`, this.formatChunks(chunks, 'pinecone'));

    // 5. Chroma payload
    zip.file(`chroma_payload.json`, this.formatChunks(chunks, 'chroma'));

    // 6. Supabase pgvector SQL script
    zip.file(`supabase_pgvector.sql`, this.formatChunks(chunks, 'supabase'));

    // 7. README & Ingestion guide
    const totalTokens = chunks.reduce((acc, c) => acc + c.tokenCount, 0);
    const readmeContent = `# RAG Dataset Export Bundle
Created with RAG Data Preparation Studio

## Dataset Summary
- Total Chunks: ${chunks.length}
- Estimated Total Tokens: ${totalTokens.toLocaleString()}
- Average Chunk Size: ${Math.round(totalTokens / (chunks.length || 1))} tokens
- Target Compatibility: OpenAI, LangChain, LlamaIndex, Pinecone, ChromaDB, Qdrant, Supabase pgvector

## Included Files
- \`${baseName}.jsonl\`: One JSON object per line (best for OpenAI batch embeddings & LangChain)
- \`${baseName}.json\`: Standard JSON array
- \`${baseName}.csv\`: Spreadsheet / Pandas compatible format
- \`pinecone_payload.json\`: Ready-to-upsert Pinecone vector format
- \`chroma_payload.json\`: ChromaDB batch load schema
- \`supabase_pgvector.sql\`: Ready-to-execute Postgres / Supabase SQL script

Enjoy building with RAG!`;

    zip.file('README.md', readmeContent);

    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${baseName}_rag_bundle.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
