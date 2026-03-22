package sqlc

import (
	"database/sql/driver"

	"github.com/lib/pq"
)

type pqStringArray []string

type pqInt64Array []int64

func (a pqStringArray) Value() (driver.Value, error) { return pq.Array([]string(a)).Value() }
func (a *pqStringArray) Scan(src interface{}) error  { return pq.Array((*[]string)(a)).Scan(src) }

func (a pqInt64Array) Value() (driver.Value, error) { return pq.Array([]int64(a)).Value() }
func (a *pqInt64Array) Scan(src interface{}) error  { return pq.Array((*[]int64)(a)).Scan(src) }
