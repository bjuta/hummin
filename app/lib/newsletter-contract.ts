/** Email-only validation shared between HUMMIN newsletter and isolated source-native Preview.
 * Confirmation and provider verification remain exclusively in the public route.
 */
export function parseNewsletterEmail(value:unknown):string|null{
 if(typeof value!=="string")return null;
 const email=value.trim().toLowerCase();
 if(!email||email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return null;
 return email;
}
