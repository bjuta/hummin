export type AdminRole="owner"|"sales"|"editor"|"partner"|"staff";
export type AdminUser={id:string;email:string;name:string;role:AdminRole;status:string};

export type AdminView="dash"|"leads"|"pipe"|"inbox"|"book"|"clients"|"posts"|"aud"|"email"|"team";
export const ALL_VIEWS:readonly AdminView[]=["dash","leads","pipe","inbox","book","clients","posts","aud","email","team"];
export type AdminAccess={view:AdminView;roles:readonly AdminRole[]};
export const PERMISSIONS:readonly AdminAccess[]=[
 {view:"dash",roles:["owner","sales","editor","partner","staff"]},
 {view:"leads",roles:["owner","sales"]},
 {view:"pipe",roles:["owner","sales"]},
 {view:"inbox",roles:["owner","sales"]},
 {view:"book",roles:["owner","sales"]},
 {view:"clients",roles:["owner","sales"]},
 {view:"posts",roles:["owner","editor"]},
 {view:"aud",roles:["owner","editor"]},
 {view:"email",roles:["owner"]},
 {view:"team",roles:["owner"]}
];
export function canView(role:AdminRole,view:AdminView){
 return PERMISSIONS.find(item=>item.view===view)?.roles.includes(role)||false;
}
export function resolveView(value:string|null):AdminView{
 return ALL_VIEWS.includes(value as AdminView)?value as AdminView:"dash";
}
