export type BackendEnv = {
  appBaseUrl: string;
  firebaseProjectId: string;
  appUrl: string;
  apiKey: string;
  apiSecret: string;
  scopes: string[];
  webhookSecret: string;
};

// Yeni bilgilerini doğrudan buraya tanımlıyoruz (Hardcoded bypass)
const NEW_CLIENT_ID = "a24af7081cbfad1b1ef1f07a617969d3";
const NEW_CLIENT_SECRET = "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";

export const getBackendEnv = (): BackendEnv => {
  return {
    // Vercel Linkin
    appBaseUrl: "https://ecom-pilot4-20vi7qhk3-sharifarifis-projects.vercel.app/",
    
    firebaseProjectId: "ecom-prototip",
    
    // Shopify App URL (startInstall fonksiyonun)
    appUrl: "https://shopifystartinstall-bi372exr4a-uc.a.run.app",
    
    // YENİ KİMLİK BİLGİLERİ
    apiKey: NEW_CLIENT_ID,
    apiSecret: NEW_CLIENT_SECRET,
    
    // İzinler (Scopes)
    scopes: [
      "read_orders", "write_orders", 
      "read_products", "write_products", 
      "read_customers", "write_customers",
      "read_inventory", "write_inventory"
    ],
    
    webhookSecret: NEW_CLIENT_SECRET
  };
};

export const getMissingBackendEnvKeys = () => []; // Manuel doldurduğumuz için boş dönüyoruz

export const hasShopifyEnv = () => true;

export const assertBackendEnv = () => getBackendEnv();

export const getShopifyEnv = () => getBackendEnv();