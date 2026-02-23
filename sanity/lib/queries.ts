import { client } from './client'
import { groq } from 'next-sanity'

// Fetch Global Settings
export async function getSettings() {
    return client.fetch(
        groq`*[_type == "settings"][0]{
      siteName,
      siteDescription,
      "logoUrl": logo.asset->url
    }`
    )
}

// Fetch a Page by slug
export async function getPageBySlug(slug: string) {
    return client.fetch(
        groq`*[_type == "page" && slug.current == $slug][0]{
      title,
      heading,
      content
    }`,
        { slug }
    )
}
