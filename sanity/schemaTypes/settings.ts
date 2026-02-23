import { defineField, defineType } from 'sanity'

export const settingsType = defineType({
    name: 'settings',
    title: 'Global Settings',
    type: 'document',
    fields: [
        defineField({
            name: 'siteName',
            title: 'Site Name',
            type: 'string',
            validation: (rule) => rule.required(),
        }),
        defineField({
            name: 'siteDescription',
            title: 'Site Description',
            type: 'text',
            description: 'Used for SEO and meta descriptions.',
        }),
        defineField({
            name: 'logo',
            title: 'Site Logo',
            type: 'image',
            options: {
                hotspot: true,
            },
        }),
    ],
})
