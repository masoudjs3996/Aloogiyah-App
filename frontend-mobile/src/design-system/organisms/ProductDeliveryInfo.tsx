import React from "react";
import {useQuery} from "@tanstack/react-query";
import {request} from "../../api/platform";
import {Card} from "../atoms/Card";
import {Text} from "../atoms/Text";
import {Button} from "../atoms/Button";
type Point={name:string;address:string;hours:string;collectionTerms:string};
export function ProductDeliveryInfo({farmCode, title = "میدان مبدأ این محصول"}:{farmCode?:string; title?:string}) {const q=useQuery({queryKey:["public-farm-delivery",farmCode],queryFn:()=>request<Point|null>("/Delivery/PublicFarmPoint/"+encodeURIComponent(farmCode!)),enabled:!!farmCode});return <Card><Text bold style={{fontSize:18}}>{title}</Text>{q.isPending?<Text muted>در حال دریافت میدان مبدأ…</Text>:q.isError?<Button outline title="تلاش دوباره برای دریافت میدان مبدأ" onPress={()=>void q.refetch()}/>:q.data?<><Text bold>{q.data.name}</Text><Text>نشانی: {q.data.address}</Text>{!!q.data.hours&&<Text>ساعت دریافت: {q.data.hours}</Text>}{!!q.data.collectionTerms&&<Text>{q.data.collectionTerms}</Text>}<Text muted>کشاورز محصول را پس از ثبت سفارش به این میدان تحویل می‌دهد. ارسال به شهرهای دیگر در مسیرهای فعال امکان‌پذیر است. هنگام خرید، میدان دریافت را انتخاب می‌کنید و هزینه انتقال و ارسال به نشانی را پیش از پرداخت می‌بینید و تأیید می‌کنید.</Text></>:<Text muted>میدان مبدأ هنوز تعیین نشده است؛ برای هماهنگی ارسال با پشتیبانی تماس بگیرید.</Text>}</Card>;}
