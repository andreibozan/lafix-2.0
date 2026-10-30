const base=require('./app.json').expo;
module.exports=()=>{
 const release=process.env.APP_VARIANT==='production';
 const api=process.env.EXPO_PUBLIC_API_URL;
 if(process.env.EAS_BUILD_PROFILE){
  if(!api)throw Error('Set EXPO_PUBLIC_API_URL for this EAS environment.');
  const url=new URL(api);
  if(url.protocol!=='https:'||url.username||url.password||url.pathname!=='/'||url.search||url.hash)throw Error('Use an HTTPS API origin without credentials, path or query.');
  if(release&&(/localhost|127\.0\.0\.1|staging/i.test(url.hostname)))throw Error('Production cannot use the test backend.');
  if(!process.env.EXPO_PUBLIC_EAS_PROJECT_ID)throw Error('Link the project to your Expo account first.');
 }
 return {...base,name:release?'LaFix':'LaFix Test',slug:'lafix',scheme:release?'lafix':'lafix-test',
  ios:{...base.ios,bundleIdentifier:release?'ro.lafix.app':'ro.lafix.app.preview'},
  android:{...base.android,package:release?'ro.lafix.app':'ro.lafix.app.preview'},
  extra:{...(process.env.EXPO_PUBLIC_EAS_PROJECT_ID?{eas:{projectId:process.env.EXPO_PUBLIC_EAS_PROJECT_ID}}:{})}};
};
