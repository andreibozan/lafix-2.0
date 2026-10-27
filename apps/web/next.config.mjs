export default {
  async headers(){return [
    {source:'/:path*',headers:[{key:'X-Content-Type-Options',value:'nosniff'},{key:'X-Frame-Options',value:'DENY'},{key:'Content-Security-Policy',value:"frame-ancestors 'none'; base-uri 'self'; object-src 'none'"}]},
    {source:'/account/:path*',headers:[{key:'Referrer-Policy',value:'no-referrer'},{key:'Cache-Control',value:'no-store'}]},
    {source:'/api/auth/:path*',headers:[{key:'Referrer-Policy',value:'no-referrer'},{key:'Cache-Control',value:'no-store'}]},
  ]},
};
