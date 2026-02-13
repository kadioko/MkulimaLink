import React from 'react';
import { Helmet } from 'react-helmet-async';

const SEOHead = ({ 
  title,
  description,
  keywords,
  image,
  url,
  type = 'website',
  locale = 'en_TZ',
  siteName = 'MkulimaLink',
  author = 'MkulimaLink Team'
}) => {
  // Default values
  const defaultTitle = 'MkulimaLink - Agriculture Super-App for East Africa';
  const defaultDescription = 'Connect farmers, buyers, and suppliers across East Africa. Buy fresh produce, get micro-loans, insurance, and farming insights. AI-powered marketplace for agriculture in Tanzania and Kenya.';
  const defaultImage = 'https://mkulimalink.co.tz/images/og-image.jpg';
  const defaultUrl = 'https://mkulimalink.co.tz';

  // Merge with defaults
  const finalTitle = title ? `${title} | ${siteName}` : defaultTitle;
  const finalDescription = description || defaultDescription;
  const finalImage = image || defaultImage;
  const finalUrl = url || defaultUrl;

  // Generate keywords
  const defaultKeywords = [
    'agriculture', 'tanzania', 'kenya', 'farmers', 'marketplace', 'fresh produce',
    'micro-loans', 'insurance', 'farming', 'crops', 'livestock',
    'mkulima', 'agritech', 'fintech', 'east africa', 'dar es salaam', 'nairobi'
  ];
  const finalKeywords = keywords 
    ? [...defaultKeywords, ...keywords].join(', ')
    : defaultKeywords.join(', ');

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{finalTitle}</title>
      <meta name="description" content={finalDescription} />
      <meta name="keywords" content={finalKeywords} />
      <meta name="author" content={author} />
      <meta name="robots" content="index, follow" />
      <meta name="language" content={locale.split('_')[0]} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:image" content={finalImage} />
      <meta property="og:image:alt" content={finalTitle} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:url" content={finalUrl} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content={locale} />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={finalTitle} />
      <meta name="twitter:description" content={finalDescription} />
      <meta name="twitter:image" content={finalImage} />
      <meta name="twitter:site" content="@mkulimalink" />
      <meta name="twitter:creator" content="@mkulimalink" />
      
      {/* Additional Meta Tags */}
      <meta name="theme-color" content="#10b981" />
      <meta name="msapplication-TileColor" content="#10b981" />
      <meta name="application-name" content={siteName} />
      <meta name="apple-mobile-web-app-title" content={siteName} />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      
      {/* Canonical URL */}
      <link rel="canonical" href={finalUrl} />
      
      {/* Alternate language versions */}
      <link rel="alternate" hreflang="en-tz" href={finalUrl} />
      <link rel="alternate" hreflang="sw-tz" href={finalUrl.replace('/en/', '/sw/')} />
      <link rel="alternate" hreflang="x-default" href={finalUrl} />
      
      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": type === 'product' ? 'Product' : 'WebSite',
          "name": finalTitle,
          "description": finalDescription,
          "url": finalUrl,
          "image": finalImage,
          "author": {
            "@type": "Organization",
            "name": siteName,
            "url": "https://mkulimalink.co.tz"
          },
          "publisher": {
            "@type": "Organization",
            "name": siteName,
            "logo": {
              "@type": "ImageObject",
              "url": "https://mkulimalink.co.tz/images/logo.png"
            }
          },
          "potentialAction": type === 'website' ? {
            "@type": "SearchAction",
            "target": "https://mkulimalink.co.tz/search?q={search_term_string}",
            "query-input": "required name=search_term_string"
          } : undefined
        })}
      </script>
    </Helmet>
  );
};

// Specific SEO components for different pages
export const ProductSEO = ({ product }) => (
  <SEOHead
    title={product.name}
    description={`${product.description} - ${product.category} from ${product.location?.region || 'East Africa'}. Price: ${product.price} ${product.currency || 'TZS'}/${product.unit}. Available on MkulimaLink.`}
    keywords={[product.category, product.location.region, 'fresh produce', 'farmers']}
    image={product.images?.[0]}
    url={`https://mkulimalink.co.tz/products/${product._id}`}
    type="product"
  />
);

export const CategorySEO = ({ category, region }) => (
  <SEOHead
    title={`${category} in ${region}`}
    description={`Buy fresh ${category} directly from farmers in ${region}. Quality produce at fair prices on MkulimaLink.`}
    keywords={[category, region, 'farmers', 'fresh produce', 'direct buying']}
    url={`https://mkulimalink.co.tz/products?category=${category}&region=${region}`}
  />
);

export const RegionSEO = ({ region }) => (
  <SEOHead
    title={`Agricultural Products in ${region}`}
    description={`Connect with farmers and buy fresh agricultural products directly from ${region}. Quality produce, fair prices.`}
    keywords={[region, 'agriculture', 'farmers', 'fresh produce', 'east africa']}
    url={`https://mkulimalink.co.tz/products?region=${region}`}
  />
);

export default SEOHead;
