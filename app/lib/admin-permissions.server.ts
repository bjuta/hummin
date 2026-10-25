export type AdminRole="owner"|"sales"|"editor"|"partner"|"staff";
export type AdminUser={id:string;email:string;name:string;role:AdminRole;status:string};
