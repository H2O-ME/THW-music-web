import { NextResponse } from 'next/server';
import crypto from 'crypto';

const CAPTCHA_ID = 'E1EC2EDF6ce881db23BCD9DF5D7BB1D';
const CAPTCHA_KEY = '6141927eb00592dba3573dfff1137a27';

export async function POST(request: Request) {
  try {
    const { lot_number, captcha_output, pass_token, gen_time } = await request.json();

    // 生成签名
    // hmac_sha256 签名，直接使用 crypto 模块
    const sign_token = crypto
      .createHmac('sha256', CAPTCHA_KEY)
      .update(lot_number)
      .digest('hex');

    const params = new URLSearchParams({
      lot_number,
      captcha_output,
      pass_token,
      gen_time,
      captcha_id: CAPTCHA_ID,
      sign_token,
    });

    const response = await fetch('https://gcaptcha4.geetest.com/validate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const result = await response.json();
    console.log('Geetest verification result:', result);

    if (result.result === 'success') {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ 
        success: false, 
        message: '极验验证未通过', 
        reason: result.reason,
        msg: result.msg 
      }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Captcha verification error:', error);
    return NextResponse.json({ 
      success: false, 
      message: '服务器验证错误' 
    }, { status: 500 });
  }
}
