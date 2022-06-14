import { useFetch } from '@saramorillon/hooks'
import { IconPlus } from '@tabler/icons'
import React from 'react'
import { Link } from 'react-router-dom'
import { getUsers } from '../../../services/user'
import { LoadContainer } from '../../components/LoadContainer'
import { User } from './User'

export function Users(): JSX.Element {
  const [users, { loading }, refresh] = useFetch(getUsers, [])

  return (
    <>
      <div className="mb2 clearfix">
        <Link className="right" to="/user">
          <IconPlus /> Create user
        </Link>
      </div>

      <LoadContainer loading={loading}>
        {users.map((user) => (
          <User key={user.username} user={user} refresh={refresh} />
        ))}
      </LoadContainer>
    </>
  )
}
