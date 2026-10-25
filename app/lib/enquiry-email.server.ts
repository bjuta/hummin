import { contactInternalEmail,contactReceivedEmail,type ContactDetails } from "./email-templates.server";

export function enquiryNotification(enquiry:ContactDetails,id:string,assetOrigin:string,sentAt?:Date){
 return contactInternalEmail(enquiry,{reference:id,assetOrigin,sentAt});
}
export function enquiryAcknowledgement(enquiry:ContactDetails,assetOrigin:string){
 return contactReceivedEmail(enquiry,assetOrigin);
}
