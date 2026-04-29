import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(req: NextRequest) {
  try {
    const {
      name, email, password, phone,
      roll_no, batch_id, date_of_birth, address,
      parent_name, parent_email, parent_phone, parent_password
    } = await req.json()

    // ── 1. Create student auth user ──────────────────────
    const { data: studentAuth, error: studentAuthError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name, role: 'parent' }
        // role: parent because students don't log in directly
      })

    if (studentAuthError) {
      console.error('Student auth error:', studentAuthError)
      return NextResponse.json({
        success: false,
        message: studentAuthError.message
      })
    }

    const studentUserId = studentAuth.user.id

    // ── 2. Wait for trigger to create profile ────────────
    await new Promise(resolve => setTimeout(resolve, 800))

    // ── 3. Update the profile with correct data ──────────
    // Trigger creates profile but may have wrong name/phone
    await supabaseAdmin
      .from('profiles')
      .update({ name, phone: phone || null, role: 'parent' })
      .eq('id', studentUserId)

    // ── 4. Handle parent account ─────────────────────────
    let parentUserId: string

    // Check if parent email already exists
    const { data: existingUsers } =
      await supabaseAdmin.auth.admin.listUsers()

    const existingParent = existingUsers?.users?.find(
      u => u.email?.toLowerCase() === parent_email?.toLowerCase()
    )

    if (existingParent) {
      // Reuse existing parent
      parentUserId = existingParent.id
    } else {
      // Create new parent auth user
      const { data: parentAuth, error: parentAuthError } =
        await supabaseAdmin.auth.admin.createUser({
          email: parent_email,
          password: parent_password,
          email_confirm: true,
          user_metadata: {
            name: parent_name || 'Parent',
            role: 'parent'
          }
        })

      if (parentAuthError) {
        console.error('Parent auth error:', parentAuthError)
        // Clean up student user we just created
        await supabaseAdmin.auth.admin.deleteUser(studentUserId)
        return NextResponse.json({
          success: false,
          message: 'Parent account error: ' + parentAuthError.message
        })
      }

      parentUserId = parentAuth.user.id

      // Wait for parent trigger
      await new Promise(resolve => setTimeout(resolve, 800))

      // Update parent profile
      await supabaseAdmin
        .from('profiles')
        .update({
          name: parent_name || 'Parent',
          phone: parent_phone || null,
          role: 'parent'
        })
        .eq('id', parentUserId)
    }

    // ── 5. Insert student row ────────────────────────────
    const { error: studentRowError } = await supabaseAdmin
      .from('students')
      .insert({
        user_id: studentUserId,
        parent_id: parentUserId,
        batch_id: batch_id || null,
        roll_no: roll_no || null,
        date_of_birth: date_of_birth || null,
        address: address || null,
        is_active: true
      })

    if (studentRowError) {
      console.error('Student row error:', studentRowError)
      return NextResponse.json({
        success: false,
        message: 'Student record error: ' + studentRowError.message
      })
    }

    return NextResponse.json({ success: true })

  } catch (err: any) {
    console.error('Add student error:', err)
    return NextResponse.json({
      success: false,
      message: err.message || 'Unexpected error'
    })
  }
}