import{useState,useEffect,useRef}from"react"
import{useCart}from"@/lib/cart-context"
import{useNavigate}from"react-router"
import{trpc}from"@/providers/trpc"
import{ArrowLeft,Lock,CreditCard,AlertCircle,Package,Store,Truck}from"lucide-react"
import SquarePaymentForm from"@/components/SquarePaymentForm"
function getDeliveryOptions(p){
if(p==="4870")return[
{id:"free_local",l:"Free Local Delivery",d:"Free delivery within Cairns",c:0,i:"truck",e:"1-2 days"},
{id:"click_collect",l:"Click & Collect",d:"22 Craven St, Redlynch",c:0,i:"store",e:"Ready in ~6hrs"},
{id:"express_shipping",l:"Express Shipping",d:"Priority delivery",c:14.99,i:"package",e:"Next day"}
]
return[
{id:"standard_shipping",l:"Standard Shipping",d:"Australia Post",c:9.99,i:"truck",e:"3-7 days"},
{id:"express_shipping",l:"Express Shipping",d:"Australia Post Express",c:14.99,i:"package",e:"1-3 days"}
]
}
export default function Checkout(){
const{items,subtotal,clearCart}=useCart()
const navigate=useNavigate()
const[step,setStep]=useState("shipping")
const[err,setErr]=useState("")
const[s,setS]=useState({n:"",e:"",p:"",a1:"",a2:"",c:"",st:"",pc:"",co:"Australia"})
const[notes,setNotes]=useState("")
const[dm,setDm]=useState("standard_shipping")
const[pt,setPt]=useState("")
const opts=getDeliveryOptions(s.pc)
const sel=opts.find(o=>o.id===dm)||opts[0]
const sc=sel?.c??9.99
const total=Math.round((subtotal+sc)*100)/100
useEffect(()=>{if(s.pc==="4870")setDm("free_local")},[s.pc])
const co=trpc.order.create.useMutation()
const pp=trpc.order.processPayment.useMutation()
const submitting=useRef(false)
const hs=(ev)=>{ev.preventDefault();setErr("");setStep("delivery")}
const hd=()=>{setErr("");setStep("payment")}
const hp=async(src)=>{
if(submitting.current)return
submitting.current=true
try{
const r=await co.mutateAsync({
items:items.map(i=>({productId:i.productId,quantity:i.quantity,size:i.size,color:i.color})),
shipping:{name:s.n,email:s.e,phone:s.p,address1:s.a1,address2:s.a2,city:s.c,state:s.st,postcode:s.pc,country:s.co},
deliveryMethod:dm,
deliveryInstructions:notes||undefined,
preferredPickupTime:pt||undefined
})
await pp.mutateAsync({orderId:r.order.id,sourceId:src,amount:total})
clearCart()
navigate("/order-confirmation?order="+r.order.orderNumber+"&email="+encodeURIComponent(s.e))
}catch(x){submitting.current=false;setErr(x.message||"Payment failed")}
}
if(items.length===0)return<div><p>Your cart is empty</p><button onClick={()=>navigate("/shop")}>Continue Shopping</button></div>
const IM={truck:<Truck/>,store:<Store/>,package:<Package/>}
return(
<div>
<div><button onClick={()=>{if(step==="delivery")setStep("shipping");else if(step==="payment")setStep("delivery");else navigate(-1)}}><ArrowLeft/></button><h1>Checkout</h1><Lock/></div>
<div>
{step==="shipping"&&<form onSubmit={hs}>
<div><CreditCard/><span>Shipping Details</span></div>
<input className="w-full bg-[#1B2432] border border-[#2A3544] rounded-lg px-4 py-3 text-sm text-white placeholder-[#6B7B8F] focus:border-[#D4A03C] focus:outline-none" placeholder="Full Name *" required value={s.n} onChange={e=>setS({...s,n:e.target.value})}/>
<input className="w-full bg-[#1B2432] border border-[#2A3544] rounded-lg px-4 py-3 text-sm text-white placeholder-[#6B7B8F] focus:border-[#D4A03C] focus:outline-none" type="email" placeholder="Email *" required value={s.e} onChange={e=>setS({...s,e:e.target.value})}/>
<input className="w-full bg-[#1B2432] border border-[#2A3544] rounded-lg px-4 py-3 text-sm text-white placeholder-[#6B7B8F] focus:border-[#D4A03C] focus:outline-none" type="tel" placeholder="Phone" value={s.p} onChange={e=>setS({...s,p:e.target.value})}/>
<input className="w-full bg-[#1B2432] border border-[#2A3544] rounded-lg px-4 py-3 text-sm text-white placeholder-[#6B7B8F] focus:border-[#D4A03C] focus:outline-none" placeholder="Address Line 1 *" required value={s.a1} onChange={e=>setS({...s,a1:e.target.value})}/>
<input className="w-full bg-[#1B2432] border border-[#2A3544] rounded-lg px-4 py-3 text-sm text-white placeholder-[#6B7B8F] focus:border-[#D4A03C] focus:outline-none" placeholder="Address Line 2" value={s.a2} onChange={e=>setS({...s,a2:e.target.value})}/>
<input className="w-full bg-[#1B2432] border border-[#2A3544] rounded-lg px-4 py-3 text-sm text-white placeholder-[#6B7B8F] focus:border-[#D4A03C] focus:outline-none" placeholder="City *" required value={s.c} onChange={e=>setS({...s,c:e.target.value})}/>
<input className="w-full bg-[#1B2432] border border-[#2A3544] rounded-lg px-4 py-3 text-sm text-white placeholder-[#6B7B8F] focus:border-[#D4A03C] focus:outline-none" placeholder="State *" required value={s.st} onChange={e=>setS({...s,st:e.target.value})}/>
<input className="w-full bg-[#1B2432] border border-[#2A3544] rounded-lg px-4 py-3 text-sm text-white placeholder-[#6B7B8F] focus:border-[#D4A03C] focus:outline-none" placeholder="Postcode *" required value={s.pc} onChange={e=>setS({...s,pc:e.target.value})}/>
<select className="w-full bg-[#1B2432] border border-[#2A3544] rounded-lg px-4 py-3 text-sm text-white focus:border-[#D4A03C] focus:outline-none appearance-none" value={s.co} onChange={e=>setS({...s,co:e.target.value})}><option value="Australia">Australia</option></select>
<textarea className="w-full bg-[#1B2432] border border-[#2A3544] rounded-lg px-4 py-3 text-sm text-white placeholder-[#6B7B8F] focus:border-[#D4A03C] focus:outline-none resize-none" value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Delivery instructions"/>
<button type="submit">Continue to Delivery Options</button>
</form>}
{step==="delivery"&&<div>
<div><Truck/><span>Delivery Options</span></div>
<p>Delivering to: {s.pc}</p>
{s.pc==="4870"&&<div>You qualify for free Cairns delivery!</div>}
<div>
{opts.map(opt=>(
<button key={opt.id} onClick={()=>setDm(opt.id)}>
{IM[opt.i]}<span>{opt.l}</span><span>{opt.d}</span><span>{opt.e}</span><span>{opt.c===0?"FREE":"$"+opt.c.toFixed(2)}</span>
</button>
))}
</div>
{dm==="click_collect"&&<div>
<p>Pick-up: 22 Craven Street, Redlynch, QLD 4870</p>
<p>Ready in ~6 hours</p>
<select className="w-full bg-[#1B2432] border border-[#2A3544] rounded-lg px-4 py-3 text-sm text-white focus:border-[#D4A03C] focus:outline-none appearance-none" value={pt} onChange={e=>setPt(e.target.value)}>
<option value="">Preferred time (optional)</option>
<option value="morning">Morning (9am-12pm)</option>
<option value="afternoon">Afternoon (12pm-4pm)</option>
<option value="evening">Evening (4pm-7pm)</option>
</select>
</div>}
<div>
<p>Order Summary</p>
<span>{items.length} items</span><span>${subtotal.toFixed(2)}</span>
<span>{sel?.l}</span><span>{sc===0?"FREE":"$"+sc.toFixed(2)}</span>
<span>Total: ${total.toFixed(2)}</span>
</div>
<button onClick={hd}>Continue to Payment</button>
<button onClick={()=>setStep("shipping")}>Back to Shipping</button>
</div>}
{step==="payment"&&<div>
<div><Lock/><span>Secure Payment</span></div>
<SquarePaymentForm amount={total} postalCode={s.pc} onPaymentSuccess={hp} onPaymentError={setErr}/>
{err&&<div><AlertCircle/>{err}</div>}
<button onClick={()=>setStep("delivery")}>Back to Delivery</button>
</div>}
</div>
</div>
)
}
