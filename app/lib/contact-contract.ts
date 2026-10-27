/** Contact validation contract mirroring the public handler in isolated no-delivery Preview.
 * Keep payload semantics identical; this module has no database or network access.
 */
export type ContactVisitor={name:string;businessName:string;email:string;message:string};
export const cleanContactField=(value:FormDataEntryValue|null)=>
 typeof value==="string"?value.trim():"";
export function validateContactVisitor(form:FormData):ContactVisitor|null{
 const v={
  name:cleanContactField(form.get("name")),
  businessName:cleanContactField(form.get("businessName")),
  email:cleanContactField(form.get("email")),
  message:cleanContactField(form.get("message"))
 };
 if(v.name.length<2||v.name.length>120||
    v.businessName.length<2||v.businessName.length>160||
    v.email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)||
    v.message.length<10||v.message.length>4000)return null;
 return v;
}
